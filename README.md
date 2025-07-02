# alembaapi
Log Tickets in Alemba using a Render hosted Node.js app

**Performace Improvements**
The URL-based approach delivers significant improvements over the previous form-based method

The implementation reduces user interaction while maintaining all security and functionality requirements.

# User Experience Flow
**Page Load**

	•	Parameters automatically extracted from URL
 
	•	Visual display shows detected parameters
 
	•	Button enabled only when all required parameters present
 
**Ticket Submission**

	•	Single click on “Log Ticket” button
 
	•	Loading spinner with visual feedback
 
	•	Direct API submission using URL parameters
 
	•	Success modal displays ticket reference number
 
	•	Button hidden to prevent duplicate submissions
 
**Maintained Features**
All existing functionality remains intact:

	•	Mobile-first responsive design using Bootstrap 5.3.3
 
	•	jQuery 3.7.1 for DOM manipulation and AJAX
 
	•	Environment variable security for credentials
 
	•	Cross-browser compatibility
 
	•	Error handling for missing parameters or API failures
 
	•	Success modal with ticket reference display
 
