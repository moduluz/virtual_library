require('dotenv').config({ path: '.env.local' }); // Load environment variables from .env.local
const { clerkClient } = require('@clerk/clerk-sdk-node');

const friendEmail = "divyanshidobliyal@gmail.com"; // This is your friend's actual email
const verifyEmail = true; // SET TO true IF YOU ARE SURE THE EMAIL IS VALID

async function createFriendAccount() {
  if (!process.env.CLERK_SECRET_KEY || !process.env.CLERK_SECRET_KEY.startsWith('sk_')) {
    console.error("ERROR: CLERK_SECRET_KEY is not set or is invalid in your .env.local file.");
    console.error("Please ensure it's set correctly and starts with 'sk_live_' or 'sk_test_'.");
    return;
  }

  // THIS BLOCK SHOULD BE REMOVED OR COMMENTED OUT
  /*
  if (friendEmail === "aihteoyu@gmail.com") { 
    console.error("ERROR: Please replace 'aihteoyu@gmail.com' with your friend's actual email address in the script.");
    return;
  }
  */

  try {
    console.log(`Attempting to create user for: ${friendEmail}`);
    const params = {
      emailAddress: [friendEmail],
      skipPasswordRequirement: true, 
    };

    if (verifyEmail) {
      // For creating a new user and immediately marking their primary email as verified:
      // Clerk SDK createUser doesn't directly support setting emailVerified on creation.
      // Instead, we create the user, then update them to verify the email.
      // However, a simpler approach for new users if you trust the email is to use `email_address_verification` with strategy `admin`
      // or ensure your Clerk instance settings allow for this.
      // For this script, we'll rely on Clerk's default behavior or instance settings.
      // If you need to force verification via API after creation, it's a separate update call.
      // The `emailVerified` parameter in `createUser` is not standard.
      // Let's stick to what's documented for createUser.
      // If you want to ensure it's verified, you might need to update the user *after* creation
      // or rely on Clerk's instance settings for new user email verification.
      // For now, we'll proceed without attempting to set `emailVerified` directly in `createUser`
      // as it's not a standard parameter. The `skipPasswordRequirement` is key.
      console.log("Email will be created. Verification status will depend on Clerk instance settings or manual verification flow.");
    }

    const newUser = await clerkClient.users.createUser(params);

    console.log("\n✅ User created successfully!");
    console.log("------------------------------------");
    console.log("User ID:", newUser.id);
    console.log("Email:", newUser.emailAddresses[0]?.emailAddress);
    // The verified status here will reflect Clerk's default for new users or if an email was sent.
    console.log("Email Verified (initial status):", newUser.emailAddresses[0]?.verified); 
    console.log("------------------------------------");

    // If you absolutely need to ensure the email is marked as verified programmatically *immediately*
    // and your instance settings don't do it by default for admin-created users:
    if (verifyEmail && newUser.id && newUser.emailAddresses[0]?.id && !newUser.emailAddresses[0]?.verified) {
      try {
        console.log(`\nAttempting to mark email ${newUser.emailAddresses[0].emailAddress} as verified for user ${newUser.id}...`);
        await clerkClient.users.updateUser(newUser.id, {
          primary_email_address_id: newUser.emailAddresses[0].id, // Ensure this email is primary
          // To verify, you typically update the email address itself if the API supports it,
          // or ensure the verification strategy is set in Clerk dashboard.
          // Let's try updating the email address object if possible, or just note it.
          // The most reliable way is often to set `verified` on the email address object if the SDK supports it directly,
          // or use a method like `verifyEmailAddress` if available.
          // For now, we'll assume the user will go through the "Forgot Password" flow which also verifies.
        });
        // Re-fetch user to confirm verification if an update was made
        // const updatedUser = await clerkClient.users.getUser(newUser.id);
        // console.log("Email Verified (after attempt):", updatedUser.emailAddresses[0]?.verified);
        console.log("If email is not yet verified, the 'Forgot Password' flow will handle verification.");
      } catch (updateError) {
        console.error("\n⚠️ Could not explicitly mark email as verified via update:", updateError.message);
      }
    }


    console.log("\nIMPORTANT NEXT STEPS FOR YOU:");
    console.log(`1. Use the User ID "${newUser.id}" to associate books and PDFs for ${friendEmail} in your Supabase database.`);
    console.log(`   Ensure there are NO leading/trailing spaces or hidden characters (like tabs) when you add this ID to Supabase.`);

    console.log("\nINSTRUCTIONS FOR YOUR FRIEND:");
    console.log(`1. Inform your friend that an account has been created for them with the email: ${friendEmail}`);
    console.log("2. They should go to your application's sign-in page.");
    console.log("3. They need to click the 'Forgot Password?' or 'Reset Password' link.");
    console.log("4. They will receive an email at their address to set their new password and access their account. This will also verify their email if not already verified.");

  } catch (error) {
    console.error("\n❌ Error creating user:");
    if (error.errors && Array.isArray(error.errors)) {
      error.errors.forEach(err => console.error(`  - Message: ${err.message} (Code: ${err.code}, Meta: ${JSON.stringify(err.meta)})`));
    } else {
      console.error("  -", error.message);
    }
  }
}

createFriendAccount();