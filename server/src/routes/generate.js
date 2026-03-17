import express from "express";
import { generateDesignStimuli } from "../services/aiService.js";
import { validateInput } from "../utils/validate.js";

const router = express.Router();

router.post("/generate", async (req, res, next) => {
  try {
    const requirement = req.body?.requirement;
    const inputError = validateInput(requirement);

    if (inputError) {
      return res.status(400).json({ error: inputError });
    }

    const result = await generateDesignStimuli(requirement.trim());
    return res.json(result);
  } catch (error) {
    return next(error);
  }
});

export default router;
