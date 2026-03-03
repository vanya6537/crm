// resources/js/components/InertiaDebugger.tsx

import { usePage } from '@inertiajs/react';
import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

export function InertiaDebugger() {
  const page = usePage();
  const [isOpen, setIsOpen] = useState(false);

  if (process.env.NODE_ENV === 'production') {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-purple-600 text-white rounded-full p-3 shadow-lg hover:bg-purple-700 transition flex items-center gap-2"
      >
        <span className="text-sm font-bold">Debug</span>
        <ChevronDown className={`h-4 w-4 transition ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute bottom-16 right-0 bg-white dark:bg-slate-900 rounded-lg shadow-xl p-4 max-w-md max-h-96 overflow-auto border border-slate-200 dark:border-slate-700">
          <div className="space-y-4">
            <div>
              <h3 className="font-bold text-sm mb-2">Current URL</h3>
              <code className="text-xs bg-slate-100 dark:bg-slate-800 p-2 rounded block break-words">
                {page.url}
              </code>
            </div>

            <div>
              <h3 className="font-bold text-sm mb-2">Component</h3>
              <code className="text-xs bg-slate-100 dark:bg-slate-800 p-2 rounded block">
                {page.component}
              </code>
            </div>

            <div>
              <h3 className="font-bold text-sm mb-2">Props Keys</h3>
              <code className="text-xs bg-slate-100 dark:bg-slate-800 p-2 rounded block break-words">
                {Object.keys(page.props).join(', ')}
              </code>
            </div>

            <details>
              <summary className="font-bold text-sm cursor-pointer hover:underline">
                Full Props (click to expand)
              </summary>
              <pre className="text-xs bg-slate-100 dark:bg-slate-800 p-2 rounded mt-2 overflow-auto max-h-48">
                {JSON.stringify(page.props, null, 2)}
              </pre>
            </details>

            <button
              onClick={() => console.log('Page:', page)}
              className="w-full text-xs bg-purple-600 text-white px-3 py-2 rounded hover:bg-purple-700 transition"
            >
              Log to Console
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
