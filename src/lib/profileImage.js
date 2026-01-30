/**
 * Resolves a profile image path to a full public URL for Supabase storage
 * @param {Object} supabase - Supabase client instance
 * @param {string|null|undefined} imagePath - The stored image path
 * @returns {string|null} - Full public URL or null
 */
export function resolveProfileImageUrl(supabase, imagePath) {
  // Return null for empty/invalid paths
  if (!imagePath || typeof imagePath !== 'string') {
    return null;
  }

  // Clean up the path - remove excessive underscores and sanitize
  let cleanPath = imagePath.trim();
  
  // If it's already a full URL, return it as-is
  if (cleanPath.startsWith('http://') || cleanPath.startsWith('https://')) {
    return cleanPath;
  }

  // Remove bucket prefix if it exists (e.g., "barista_profile/")
  // The path should be relative to the bucket
  const bucketName = 'barista_profile';
  
  // Clean up path: remove leading slashes and normalize
  cleanPath = cleanPath.replace(/^\/+/, '');
  
  // Remove bucket name if it's included in the path
  if (cleanPath.startsWith(`${bucketName}/`)) {
    cleanPath = cleanPath.substring(bucketName.length + 1);
  }

  try {
    // Get public URL from Supabase storage
    const { data } = supabase
      .storage
      .from(bucketName)
      .getPublicUrl(cleanPath);

    if (data?.publicUrl) {
      // Add cache-busting parameter to avoid stale images
      const timestamp = Date.now();
      const separator = data.publicUrl.includes('?') ? '&' : '?';
      return `${data.publicUrl}${separator}t=${timestamp}`;
    }

    return null;
  } catch (error) {
    console.error('Error resolving profile image URL:', error);
    return null;
  }
}

/**
 * Alternative implementation that constructs URL manually
 * Use this if getPublicUrl doesn't work correctly
 */
export function resolveProfileImageUrlManual(supabase, imagePath) {
  if (!imagePath || typeof imagePath !== 'string') {
    return null;
  }

  let cleanPath = imagePath.trim();
  
  if (cleanPath.startsWith('http://') || cleanPath.startsWith('https://')) {
    return cleanPath;
  }

  const bucketName = 'barista_profile';
  cleanPath = cleanPath.replace(/^\/+/, '');
  
  if (cleanPath.startsWith(`${bucketName}/`)) {
    cleanPath = cleanPath.substring(bucketName.length + 1);
  }

  // Get Supabase project URL
  const supabaseUrl = supabase.supabaseUrl || process.env.REACT_APP_SUPABASE_URL;
  
  if (!supabaseUrl) {
    console.error('Supabase URL not found');
    return null;
  }

  // Encode the path to handle special characters
  const encodedPath = cleanPath.split('/').map(encodeURIComponent).join('/');
  
  // Construct public URL manually
  const timestamp = Date.now();
  return `${supabaseUrl}/storage/v1/object/public/${bucketName}/${encodedPath}?t=${timestamp}`;
}