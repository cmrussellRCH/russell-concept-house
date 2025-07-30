// Central configuration for media URLs - easy to switch providers later
export const mediaConfig = {
  provider: 'cloudinary',
  
  providers: {
    cloudinary: {
      baseUrl: 'https://res.cloudinary.com/dt9bnjukm/',
      imageUpload: 'image/upload/',
      imageTransform: (path, options = {}) => {
        const { width, height, quality = 'auto' } = options;
        const transforms = [];
        
        if (width) transforms.push(`w_${width}`);
        if (height) transforms.push(`h_${height}`);
        transforms.push(`q_${quality}`, 'f_auto');
        
        return transforms.join(',') + '/';
      }
    },
    // Future providers can be added here
  }
};

export const getMediaUrl = (src, options = {}) => {
  // If it's already a full URL (existing articles), return as-is
  if (src && (src.startsWith('http://') || src.startsWith('https://'))) {
    return src;
  }
  
  // For new relative paths, build URL with current provider
  const config = mediaConfig.providers[mediaConfig.provider];
  const transforms = config.imageTransform('', options);
  
  return config.baseUrl + config.imageUpload + transforms + src;
};