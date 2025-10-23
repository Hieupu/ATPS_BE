const authService = require("../services/authService");

const login = async (req, res) => {
  try {
    const { email, password, provider = "local" } = req.body;
    const result = await authService.loginService(email, password, provider);
    res.json({
      message: "Login successful",
      token: result.token,
      user: {
        id: result.user.AccID,
        username: result.user.Username,
        email: result.user.Email,
        status: result.user.Status,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(error.status || 500).json({ message: error.message });
  }
};

const register = async (req, res) => {
  try {
    const { username, email, phone, password, provider = "local" } = req.body;
    const result = await authService.registerService({
      username,
      email,
      phone,
      password,
      provider,
    });
    res.status(201).json({
      message: "Account created successfully",
      id: result.id,
    });
  } catch (error) {
    console.error("Register error:", error);
    res.status(error.status || 500).json({ message: error.message });
  }
};

module.exports = {
  login,
  register,
};
