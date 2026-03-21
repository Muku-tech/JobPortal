const { User } = require("../models");
const path = require("path");
const fs = require("fs");
const auth = require("../middleware/auth");

// Upload company logo
exports.uploadLogo = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Delete old logo if exists
    if (user.logo) {
      const oldLogoPath = path.join(
        __dirname,
        "../public/logos",
        path.basename(user.logo),
      );
      if (fs.existsSync(oldLogoPath)) {
        fs.unlinkSync(oldLogoPath);
      }
    }

    // New logo path: /logos/filename.ext
    const logoPath = `/logos/${req.file.filename}`;
    await user.update({ logo: logoPath });

    res.json({
      message: "Logo uploaded successfully",
      logo: logoPath,
    });
  } catch (error) {
    console.error("Logo upload error:", error);
    res.status(500).json({ message: error.message });
  }
};
