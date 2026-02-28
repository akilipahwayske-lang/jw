/**
 * JobWhisper - Main JavaScript
 */

document.addEventListener('DOMContentLoaded', () => {
  // 1. Mobile Menu Toggle
  const mobileMenuBtn = document.getElementById('mobileMenuBtn');
  const navLinks = document.querySelector('.nav-links');
  const navActions = document.querySelector('.nav-actions');

  if (mobileMenuBtn) {
    mobileMenuBtn.addEventListener('click', () => {
      // Toggle a simple active class or basic inline style for mobile menu
      if (navLinks.style.display === 'flex') {
        navLinks.style.display = 'none';
        
        // Hide all actions except the mobile menu button
        Array.from(navActions.children).forEach(child => {
          if(child.id !== 'mobileMenuBtn') child.style.display = 'none';
        });
      } else {
        navLinks.style.display = 'flex';
        navLinks.style.flexDirection = 'column';
        navLinks.style.position = 'absolute';
        navLinks.style.top = '100%';
        navLinks.style.left = '0';
        navLinks.style.width = '100%';
        navLinks.style.backgroundColor = 'var(--bg-white)';
        navLinks.style.padding = '1rem 0';
        navLinks.style.boxShadow = 'var(--shadow-md)';
        navLinks.style.alignItems = 'center';
        
        // Show all actions
        Array.from(navActions.children).forEach(child => {
          if(child.id !== 'mobileMenuBtn') child.style.display = 'inline-flex';
        });
      }
    });
  }

  // 2. Contact Form handling via EmailJS
  const contactForm = document.getElementById('contact-form');
  if (contactForm) {
    // Note for User: To make this work fully, you need to sign up for EmailJS (emailjs.com).
    // Initialize EmailJS with your Public Key.
    // emailjs.init('YOUR_EMAILJS_PUBLIC_KEY');

    contactForm.addEventListener('submit', function(event) {
      event.preventDefault();
      
      const submitBtn = contactForm.querySelector('button[type="submit"]');
      const originalBtnText = submitBtn.innerHTML;
      submitBtn.innerHTML = '<i data-lucide="loader"></i> Sending...';
      submitBtn.disabled = true;
      if (window.lucide) window.lucide.createIcons();

      // EmailJS sendForm requires: Service ID, Template ID, Form Element
      // Example: emailjs.sendForm('service_abc123', 'template_xyz456', this)
      
      // MOCK SEND: Simulate network request for demonstration
      setTimeout(() => {
        // Assume success for demo
        const formResponse = document.getElementById('form-response');
        formResponse.style.display = 'block';
        formResponse.className = 'alert alert-success';
        formResponse.innerHTML = 'Thank you! Your message has been sent successfully.';
        
        // Reset form
        contactForm.reset();
        
        // Reset button
        submitBtn.innerHTML = originalBtnText;
        submitBtn.disabled = false;
        if (window.lucide) window.lucide.createIcons();

        // Hide notification after 5 seconds
        setTimeout(() => {
          formResponse.style.display = 'none';
        }, 5000);

      }, 1500);

      /* REAL EMAILJS CODE (Uncomment and add your IDs to use):
      emailjs.sendForm('YOUR_SERVICE_ID', 'YOUR_TEMPLATE_ID', this)
        .then(() => {
            const formResponse = document.getElementById('form-response');
            formResponse.style.display = 'block';
            formResponse.className = 'alert alert-success';
            formResponse.innerHTML = 'Message sent successfully!';
            contactForm.reset();
        }, (error) => {
            const formResponse = document.getElementById('form-response');
            formResponse.style.display = 'block';
            formResponse.className = 'alert alert-error';
            formResponse.innerHTML = 'Failed to send message: ' + JSON.stringify(error);
        }).finally(() => {
            submitBtn.innerHTML = originalBtnText;
            submitBtn.disabled = false;
            if (window.lucide) window.lucide.createIcons();
        });
      */
    });
  }
});
