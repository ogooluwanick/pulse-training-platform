'use client';

import { useEffect, useState } from 'react';
import 'react-quill/dist/quill.snow.css';

interface WYSIWYGContentRendererProps {
  content: string;
  className?: string;
}

export default function WYSIWYGContentRenderer({
  content,
  className = '',
}: WYSIWYGContentRendererProps) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return (
      <div className={`prose prose-lg max-w-none ${className}`}>
        <div
          className="text-charcoal leading-relaxed"
          dangerouslySetInnerHTML={{
            __html: content.replace(/\n/g, '<br>'),
          }}
        />
      </div>
    );
  }

  return (
    <div className={`quill-light-theme ${className}`}>
      <div
        className="ql-editor"
        dangerouslySetInnerHTML={{ __html: content }}
      />
      <style jsx global>{`
        .quill-light-theme .ql-editor {
          font-family: inherit;
          line-height: 1.6;
          color: #2c3e50;
          padding: 0;
          background: transparent;
        }

        .quill-light-theme .ql-editor h1,
        .quill-light-theme .ql-editor h2,
        .quill-light-theme .ql-editor h3,
        .quill-light-theme .ql-editor h4,
        .quill-light-theme .ql-editor h5,
        .quill-light-theme .ql-editor h6 {
          color: #2c3e50;
          font-weight: 600;
          margin-top: 1.5em;
          margin-bottom: 0.5em;
        }

        .quill-light-theme .ql-editor h1 {
          font-size: 2em;
          border-bottom: 2px solid #e9ecef;
          padding-bottom: 0.3em;
        }

        .quill-light-theme .ql-editor h2 {
          font-size: 1.5em;
          border-bottom: 1px solid #e9ecef;
          padding-bottom: 0.3em;
        }

        .quill-light-theme .ql-editor h3 {
          font-size: 1.25em;
        }

        .quill-light-theme .ql-editor h4 {
          font-size: 1.1em;
        }

        .quill-light-theme .ql-editor p {
          margin-bottom: 1em;
          line-height: 1.7;
        }

        .quill-light-theme .ql-editor ul,
        .quill-light-theme .ql-editor ol {
          margin-bottom: 1em;
          padding-left: 2em;
        }

        .quill-light-theme .ql-editor li {
          margin-bottom: 0.5em;
        }

        .quill-light-theme .ql-editor ul li {
          list-style-type: disc;
        }

        .quill-light-theme .ql-editor ol li {
          list-style-type: decimal;
        }

        .quill-light-theme .ql-editor blockquote {
          border-left: 4px solid #3498db;
          margin: 1.5em 0;
          padding: 0.5em 1em;
          background-color: #f8f9fa;
          font-style: italic;
        }

        .quill-light-theme .ql-editor code {
          background-color: #f8f9fa;
          padding: 0.2em 0.4em;
          border-radius: 3px;
          font-family: 'Courier New', monospace;
          font-size: 0.9em;
        }

        .quill-light-theme .ql-editor pre {
          background-color: #f8f9fa;
          padding: 1em;
          border-radius: 5px;
          overflow-x: auto;
          margin: 1em 0;
        }

        .quill-light-theme .ql-editor pre code {
          background-color: transparent;
          padding: 0;
        }

        .quill-light-theme .ql-editor strong,
        .quill-light-theme .ql-editor b {
          font-weight: 600;
        }

        .quill-light-theme .ql-editor em,
        .quill-light-theme .ql-editor i {
          font-style: italic;
        }

        .quill-light-theme .ql-editor u {
          text-decoration: underline;
        }

        .quill-light-theme .ql-editor a {
          color: #3498db;
          text-decoration: underline;
        }

        .quill-light-theme .ql-editor a:hover {
          color: #2980b9;
        }

        .quill-light-theme .ql-editor table {
          border-collapse: collapse;
          width: 100%;
          margin: 1em 0;
        }

        .quill-light-theme .ql-editor table th,
        .quill-light-theme .ql-editor table td {
          border: 1px solid #dee2e6;
          padding: 0.75em;
          text-align: left;
        }

        .quill-light-theme .ql-editor table th {
          background-color: #f8f9fa;
          font-weight: 600;
        }

        .quill-light-theme .ql-editor img {
          max-width: 100%;
          height: auto;
          border-radius: 5px;
          margin: 1em 0;
        }

        .quill-light-theme .ql-editor hr {
          border: none;
          border-top: 2px solid #e9ecef;
          margin: 2em 0;
        }

        /* Custom styling for better readability */
        .quill-light-theme .ql-editor {
          max-width: 100%;
          word-wrap: break-word;
        }

        /* Responsive design */
        @media (max-width: 768px) {
          .quill-light-theme .ql-editor h1 {
            font-size: 1.75em;
          }

          .quill-light-theme .ql-editor h2 {
            font-size: 1.4em;
          }

          .quill-light-theme .ql-editor h3 {
            font-size: 1.2em;
          }

          .quill-light-theme .ql-editor ul,
          .quill-light-theme .ql-editor ol {
            padding-left: 1.5em;
          }
        }
      `}</style>
    </div>
  );
}
