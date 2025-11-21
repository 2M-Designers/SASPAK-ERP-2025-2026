// Facebook-style top bar loader with skeleton UI
export function FacebookStyleLoader() {
  return (
    <div className='fixed top-0 left-0 w-full z-50'>
      <div className='h-1 bg-gray-200'>
        <div className='h-full bg-blue-600 relative overflow-hidden'>
          <div className='absolute top-0 bottom-0 left-0 w-1/2 bg-blue-500 animate-[facebook-loader_2s_ease-in-out_infinite]'></div>
        </div>
      </div>
      <div className='bg-white border-b border-gray-200'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='flex justify-between items-center py-4'>
            <div className='flex items-center space-x-3'>
              <div className='h-8 w-8 bg-gray-200 rounded-lg animate-pulse'></div>
              <div className='space-y-2'>
                <div className='h-4 w-40 bg-gray-200 rounded animate-pulse'></div>
                <div className='h-3 w-24 bg-gray-200 rounded animate-pulse'></div>
              </div>
            </div>
            <div className='flex items-center space-x-3'>
              <div className='hidden md:flex space-x-2'>
                <div className='h-9 w-20 bg-gray-200 rounded-lg animate-pulse'></div>
                <div className='h-9 w-20 bg-gray-200 rounded-lg animate-pulse'></div>
                <div className='h-9 w-24 bg-gray-200 rounded-lg animate-pulse'></div>
              </div>
              <div className='h-9 w-32 bg-gray-200 rounded-lg animate-pulse'></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Minimal top bar loader (like YouTube)
export function MinimalLoadingBar() {
  return (
    <div className='fixed top-0 left-0 w-full z-50'>
      <div className='h-1 bg-gray-200 overflow-hidden'>
        <div className='h-full bg-blue-600 animate-[loading-indeterminate_1.5s_ease-in-out_infinite]'></div>
      </div>
    </div>
  );
}

// Simple NProgress style loader
export function NProgressStyleLoader() {
  return (
    <div className='fixed top-0 left-0 w-full z-50'>
      <div className='h-1 bg-blue-600 shadow-lg'>
        <div className='h-full bg-blue-400 animate-[nprogress-spinner_0.8s_linear_infinite] relative'>
          <div className='absolute right-0 w-4 h-4 -mt-1.5 -mr-2 bg-blue-600 rounded-full shadow-lg'></div>
        </div>
      </div>
    </div>
  );
}
