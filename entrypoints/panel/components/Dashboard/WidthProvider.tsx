import React, { useEffect, useRef, useState, ComponentType } from "react";

export interface WidthProviderProps {
  measureBeforeMount?: boolean;
  className?: string;
  style?: React.CSSProperties;
  width?: number;
}

export function WidthProvider<P extends { width: number }>(
  ComposedComponent: ComponentType<P>
): React.FC<Omit<P, "width"> & WidthProviderProps> {
  return (props) => {
    const defaultWidth = 1200;
    const [width, setWidth] = useState<number>(defaultWidth);
    const [mounted, setMounted] = useState(false);
    const elementRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
      setMounted(true);
      const el = elementRef.current;
      if (!el) return;

      const updateWidth = (nextWidth: number) => {
        const rounded = Math.round(nextWidth);
        setWidth((prev) => (Math.abs(prev - rounded) >= 1 ? rounded : prev));
      };

      const resizeObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
           // Use contentRect.width for precise content box width or offsetWidth
           updateWidth(entry.contentRect.width);
        }
      });
      
      resizeObserver.observe(el);
      
      // Set initial
      updateWidth(el.getBoundingClientRect().width);

      return () => {
        resizeObserver.disconnect();
      };
    }, []);

    const { measureBeforeMount, className, style, ...rest } = props as any;

    return (
      <div
        className={className}
        style={{ ...style, width: '100%', height: '100%' }} // Ensure container fills parent
        ref={elementRef}
      >
        {(mounted || !measureBeforeMount) && (
             <ComposedComponent {...rest} width={width} />
        )}
      </div>
    );
  };
}
