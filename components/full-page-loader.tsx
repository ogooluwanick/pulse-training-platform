import { FC } from 'react';

interface FullPageLoaderProps {
  placeholder?: string;
}

const FullPageLoader: FC<FullPageLoaderProps> = ({
  placeholder = 'workspace',
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm min-h-[90vh]">
      <div className="text-center space-y-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-charcoal text-alabaster mx-auto animate-pulse">
          <span className="text-lg font-bold">P</span>
        </div>
        <p className="text-warm-gray">Loading your {placeholder}...</p>
      </div>
    </div>
  );
};

export default FullPageLoader;
