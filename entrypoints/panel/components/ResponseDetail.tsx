import React, { useState } from 'react';
import { NetworkEntry, ResponseTabMode } from '../types';
import {
  renderHighlightedText,
  headerMatches,
  buildResponseJson,
  prettyBody,
  formatBytes,
  formatDuration,
  statusTone,
  highlightCode,
} from '../utils';

interface ResponseDetailProps {
  selectedRequest: NetworkEntry | null;
}

export const ResponseDetail: React.FC<ResponseDetailProps> = ({
  selectedRequest,
}) => {
  const [responseTab, setResponseTab] = useState<ResponseTabMode>('pretty');
  const [responseSearch, setResponseSearch] = useState('');
  const [bodyCopied, setBodyCopied] = useState(false);

  const responseSearchTerm = responseSearch.trim().toLowerCase();
  const responseHeaders = selectedRequest?.responseHeaders ?? [];

  const filteredResponseHeaders = responseHeaders.filter((header) =>
    headerMatches(header, responseSearchTerm),
  );

  const responseLine = selectedRequest
    ? `${selectedRequest.responseHttpVersion ?? 'HTTP'} ${
        selectedRequest.status ?? ''
      } ${selectedRequest.statusText ?? ''}`.trim()
    : 'No response selected.';

  const responseTone = statusTone(selectedRequest?.status);
  const responseBody = prettyBody(selectedRequest?.responseBody);

  const handleCopyBody = async () => {
    if (!responseBody) return;

    let success = false;
    try {
      await navigator.clipboard.writeText(responseBody);
      success = true;
    } catch {
      // Fallback for environments where navigator.clipboard is unavailable
      const textArea = document.createElement('textarea');
      textArea.value = responseBody;
      textArea.style.position = 'fixed'; // Avoid scrolling to bottom
      document.body.appendChild(textArea);
      textArea.select();
      try {
        success = document.execCommand('copy');
      } catch (e) {
        console.error(e);
      }
      document.body.removeChild(textArea);
    }

    if (success) {
      setBodyCopied(true);
      setTimeout(() => setBodyCopied(false), 2000);
    }
  };

  const responseJsonText = selectedRequest
    ? JSON.stringify(buildResponseJson(selectedRequest), null, 2)
    : '';

  return (
    <section className="panel panel--response">
      <div className="panel-header">
        <div className="panel-title">
          <span className="eyebrow">Response</span>
          <h2>{responseLine}</h2>
        </div>
        <div className="panel-actions">
          <span className={`badge badge--${responseTone}`}>
            {selectedRequest?.status ?? '---'}
          </span>
          <span className="badge badge--info">
            {formatBytes(selectedRequest?.size)}
          </span>
          <span className="badge badge--time">
            {formatDuration(selectedRequest?.time)}
          </span>
        </div>
      </div>
      <div className="tabs">
        <button
          className={`tab${responseTab === 'pretty' ? ' active' : ''}`}
          onClick={() => setResponseTab('pretty')}
        >
          Pretty
        </button>
        <button
          className={`tab${responseTab === 'json' ? ' active' : ''}`}
          onClick={() => setResponseTab('json')}
        >
          Json
        </button>
      </div>
      <div className="panel-body">
        <div className="search small">
          <input
            type="search"
            value={responseSearch}
            onChange={(event) => setResponseSearch(event.target.value)}
            placeholder="Search in response..."
            aria-label="Search in response"
          />
          <button
            className="btn ghost slim"
            onClick={() => setResponseSearch('')}
          >
            Clear
          </button>
        </div>

        <div className="response-content">
          {selectedRequest ? (
            responseTab === 'json' ? (
              <pre
                className="code-block hljs"
                dangerouslySetInnerHTML={{
                  __html: highlightCode(
                    responseJsonText,
                    'json',
                    responseSearchTerm,
                  ),
                }}
              />
            ) : (
              <>
                <div className="section-title">Headers</div>
                {filteredResponseHeaders.length ? (
                  <div className="kv-grid">
                    {filteredResponseHeaders.map((header) => (
                      <div
                        className={`kv-row${
                          responseSearchTerm &&
                          headerMatches(header, responseSearchTerm)
                            ? ' match'
                            : ''
                        }`}
                        key={`${header.key}-${header.value}`}
                      >
                        <span className="kv-key">
                          {renderHighlightedText(header.key, responseSearchTerm)}
                        </span>
                        <span className="kv-value">
                          {renderHighlightedText(
                            header.value,
                            responseSearchTerm,
                          )}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="empty-state">No response headers found.</div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div className="section-title">Body</div>
                  {responseBody && (
                    <button 
                      className="btn ghost slim" 
                      onClick={handleCopyBody}
                      disabled={bodyCopied}
                    >
                      {bodyCopied ? 'Copied' : 'Copy'}
                    </button>
                  )}
                </div>
                {responseBody ? (
                  <pre
                    className="code-block hljs"
                    dangerouslySetInnerHTML={{
                      __html: highlightCode(
                        responseBody,
                        (responseBody.startsWith('{') ||
                          responseBody.startsWith('['))
                          ? 'json'
                          : responseBody.trim().startsWith('<')
                            ? 'xml'
                            : 'plaintext',
                        responseSearchTerm,
                      ),
                    }}
                  />
                ) : (
                  <pre className="code-block">
                    Response body not captured yet.
                  </pre>
                )}
              </>
            )
          ) : (
            <div className="empty-state">
              Select a request to view the response.
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
