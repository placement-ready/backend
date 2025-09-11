export class ValidationUtils {
	// Validate email format
	static isValidEmail(email: string): boolean {
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		return emailRegex.test(email);
	}

	// Validate password strength
	static isValidPassword(password: string): { valid: boolean; message?: string } {
		if (password.length < 8) {
			return { valid: false, message: "Password must be at least 8 characters long" };
		}

		if (password.length > 128) {
			return { valid: false, message: "Password must be less than 128 characters long" };
		}

		// Check for at least one number, one letter, and one special character
		const hasNumber = /\d/.test(password);
		const hasLetter = /[a-zA-Z]/.test(password);
		const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);

		if (!hasNumber || !hasLetter || !hasSpecial) {
			return {
				valid: false,
				message: "Password must contain at least one number, one letter, and one special character",
			};
		}

		return { valid: true };
	}

	// Validate MongoDB ObjectId format
	static isValidObjectId(id: string): boolean {
		return /^[0-9a-fA-F]{24}$/.test(id);
	}

	// Sanitize string input
	static sanitizeString(input: string): string {
		return input
			.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
			.replace(/javascript:/gi, "")
			.replace(/on\w+\s*=/gi, "");
	}
}
