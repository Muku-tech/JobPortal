const generateMessage = (action, data = {}) => {
  const { interviewDate, jobTitle = "", applicantName = "" } = data;

  switch (action) {
    case "shortlist":
      return `You have been shortlisted for "${jobTitle}". Next steps coming soon!`;

    case "interview":
      return interviewDate
        ? `Interview scheduled for "${jobTitle}" on ${interviewDate}. Please confirm.`
        : `Interview scheduled for "${jobTitle}". Check details to confirm.`;

    case "hire":
      return `Congratulations ${applicantName}! You have been selected for "${jobTitle}". Welcome aboard!`;

    case "reject":
      return `Thank you ${applicantName} for applying to "${jobTitle}". We appreciate your interest but have selected another candidate. We will keep your profile for future opportunities.`;

    default:
      return "Application status updated.";
  }
};

module.exports = { generateMessage };
