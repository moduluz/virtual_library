// Test script for Supabase Storage upload with RLS
// To use this script:
// 1. Copy this entire file
// 2. Go to your add-book or edit-book page in the browser
// 3. Open the browser console (F12)
// 4. Paste and run the following code

// This version doesn't rely on imports which can be problematic in the console
async function testUpload() {
  try {
    // Create a small test PDF file (this is just a minimal valid PDF)
    const pdfContent = '%PDF-1.0\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n3 0 obj<</Type/Page/MediaBox[0 0 3 3]>>endobj\nxref\n0 4\n0000000000 65535 f\n0000000010 00000 n\n0000000053 00000 n\n0000000102 00000 n\ntrailer<</Size 4/Root 1 0 R>>\nstartxref\n149\n%%EOF';
    const blob = new Blob([pdfContent], { type: 'application/pdf' });
    const testFile = new File([blob], 'test.pdf', { type: 'application/pdf' });
    
    // Get the current user ID from the page
    // For Clerk auth, we can try to extract it from the page or use a hardcoded value for testing
    let userId;
    
    // Try to get userId from various possible locations
    // 1. Try data attribute if you've added it to your page
    userId = document.querySelector('[data-user-id]')?.dataset.userId;
    
    // 2. If not found, try to get it from Clerk's global object if available
    if (!userId && window.Clerk) {
      userId = window.Clerk.user?.id;
    }
    
    // 3. If still not found, check localStorage for any user data
    if (!userId) {
      try {
        const userDataStr = localStorage.getItem('userData') || localStorage.getItem('user');
        if (userDataStr) {
          const userData = JSON.parse(userDataStr);
          userId = userData.id || userData.userId || userData.user_id;
        }
      } catch (e) {
        console.warn('Could not parse user data from localStorage', e);
      }
    }
    
    // 4. Last resort - prompt the user to enter their ID
    if (!userId) {
      userId = prompt('Please enter your user ID for testing:');
    }
    
    // Get Supabase token - try multiple possible storage locations
    let token;
    try {
      // Try different localStorage keys where the token might be stored
      const supabaseAuthStr = localStorage.getItem('supabase.auth.token') || 
                              localStorage.getItem('sb-auth-token') ||
                              localStorage.getItem('supabaseSession');
      
      if (supabaseAuthStr) {
        const authData = JSON.parse(supabaseAuthStr);
        token = authData.access_token || authData.token;
      }
    } catch (e) {
      console.warn('Could not parse Supabase token from localStorage', e);
    }
    
    // If token not found, prompt user
    if (!token) {
      token = prompt('Please enter your Supabase access token for testing:');
    }
    
    console.log('Test upload starting with:', { userId, fileSize: testFile.size });
    
    // Use the Supabase client that's already loaded in the page
    // This avoids import issues
    const supabase = window.supabaseClient || window.supabase;
    
    if (!supabase) {
      throw new Error('Supabase client not found in the global scope. Try running this on a page where Supabase is initialized.');
    }
    
    // Upload directly using the Supabase client
    const bucketName = 'books-pdf';
    const fileName = `${userId}/${Date.now()}-test-book.pdf`;
    
    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(fileName, testFile, {
        cacheControl: '3600',
        upsert: true,
        contentType: 'application/pdf'
      });
    
    if (error) {
      throw new Error(`Upload failed: ${error.message}`);
    }
    
    console.log('Upload successful!', data);
    return data;
  } catch (error) {
    console.error('Upload test failed:', error);
    throw error;
  }
}

// Run the test
testUpload().then(result => {
  console.log('Test completed with result:', result);
}).catch(err => {
  console.error('Test failed with error:', err);
});
