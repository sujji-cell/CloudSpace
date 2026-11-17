import "dotenv/config";
import sendEmail from "./utils/sendEmail.js";

const testEmail = async () => {
    try {
        await sendEmail(
            "Your_mail@gmail.com",
            "CloudSpace Email Test",
            `
            <div style="font-family: Arial; padding: 20px;">
                <h2>Welcome to CloudSpace!</h2>
                <p>Your email configuration is working successfully.</p>
                <p>We are ready to implement OTP verification.</p>
            </div>
            `
        );

        console.log("Email test completed successfully!");

    } catch (error) {
        console.error("Email test failed:", error.message);
    }
};
console.log("Email configured:", !!process.env.EMAIL_USER);
console.log("Password configured:", !!process.env.EMAIL_PASS);
console.log("Password length:", process.env.EMAIL_PASS?.length);

testEmail();