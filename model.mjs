import { pool } from "./db.mjs";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI,
  organization: process.env.ORGANIZATION,
});

class UserProfileStore {
  async findByIdUser(iduser) {
    try {
      const [rows] = await pool.query(
        "SELECT * FROM user_profile WHERE iduser = ?",
        [iduser]
      );
      return rows[0] || null;
    } catch (error) {
      console.error("Error finding user by ID:", error);
      throw new Error("Database error");
    }
  }
  async findUserRoutinesById(iduser) {
    try {
      const [rows] = await pool.query(
        "SELECT * FROM user_routines WHERE iduser = ?",
        [iduser]
      );
      return rows[0] || null;
    } catch (error) {
      console.error("Error finding user by ID:", error);
      throw new Error("Database error");
    }
  }
  async findUserRecipesById(iduser) {
    try {
      const [rows] = await pool.query(
        "SELECT * FROM user_recipes WHERE iduser = ?",
        [iduser]
      );
      return rows[0] || null;
    } catch (error) {
      console.error("Error finding user by ID:", error);
      throw new Error("Database error");
    }
  }
  async updateUserProfile(
    iduser,
    username,
    age,
    weight,
    height,
    objective,
    training_days,
    profiling_form
  ) {
    const connection = await pool.getConnection();
    try {
      console.log(
        "UPDATEPROFILE DATA",
        iduser,
        age,
        weight,
        height,
        training_days,
        objective
      );
      await connection.beginTransaction();

      await connection.query(
        `INSERT INTO user_profile (iduser, age, weight, height, training_days ,objective)
         VALUES (?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
         age = VALUES(age),
         weight = VALUES(weight),
         height = VALUES(height),
         objective = VALUES(objective),
         training_days = VALUES(training_days)`,
        [iduser, age, weight, height, training_days, objective]
      );

      await connection.query(
        "UPDATE user SET username = ?, profiling_form = ? WHERE id = ?",
        [username, profiling_form, iduser]
      );

      const [updatedRows] = await connection.query(
        "SELECT * FROM user_profile WHERE iduser = ?",
        [iduser]
      );

      await connection.commit();

      return updatedRows[0] || null;
    } catch (error) {
      await connection.rollback();
      console.error("Error updating user profile:", error);
      throw new Error("Database error");
    } finally {
      connection.release();
    }
  }

  async createRoutine(age, weight, height, objective, training_days) {
    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: "You are a helpful assistant." },
          {
            role: "user",
            content: `You can make an exercise routine for ${training_days} 
          days for a person who is ${age} years old and weighs ${weight} KG with a height of ${height}CM and 
          her goal is ${objective}. The routine should last a minimum of 1 hour to 1.5 hours.`,
          },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "routine_schema",
            schema: {
              type: "object",
              properties: {
                routines: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      exercise: {
                        type: "array",
                        items: {
                          type: "object",
                          properties: {
                            exercise: { type: "string" },
                            duration: { type: "string" },
                            calories: { type: "number" },
                            sets: { type: "number" },
                            reps: { type: "number" },
                            imgUrl: { type: "string", format: "uri" },
                            videoUrl: { type: "string", format: "uri" },
                          },
                          required: [
                            "exercise",
                            "duration",
                            "calories",
                            "sets",
                            "reps",
                            "imgUrl",
                            "videoUrl",
                          ],
                        },
                      },
                    },
                    required: ["exercise"],
                  },
                },
              },
              required: ["routines"],
            },
          },
        },
      });

      return completion.choices[0].message.content;
    } catch (error) {
      console.error("Error generating routine:", error);
      throw new Error("OpenAI API error");
    }
  }

  async saveRoutine(userid, routines) {
    console.log("routines", routines);
    try {
      await pool.query(
        `INSERT INTO user_routines (iduser, routines)
         VALUES (?, ?)
         ON DUPLICATE KEY UPDATE
         routines = VALUES(routines)`,
        [userid, routines]
      );
      return;
    } catch (error) {
      console.error("Error saving routine:", error);
      throw new Error("Database error");
    }
  }

  async createRecipes(age, weight, height, objective) {
    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are an expert assistant in nutrition and recipes.",
          },
          {
            role: "user",
            content: `Generate a structured JSON containing meal types (Breakfast, Lunch, Dinner). 
      Each meal type should include a list of recipes tailored for a person with the following characteristics:
      - Age: ${age} years old
      - Weight: ${weight} kg
      - Height: ${height} cm
      - Objective: ${objective}
      
     
      For each recipe, include:
      - 'name': the name of the recipe.
      - 'ingredients': a list of specific ingredients.
      - 'nutritional': a list of nutritional information (calories, proteins, fats, etc.).
      - 'videoExample': a link to a video (realistic or fictional).
      - 'imgUrl': a link to an image (realistic or fictional).
      
      Generate at least 5 unique recipes for each meal type (Breakfast, Lunch, Dinner) and ensure the recipes are appropriate for the specified person and their objective.`,
          },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "recipes_schema",
            schema: {
              type: "object",
              properties: {
                recipes: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      type: { type: "string" }, // Breakfast, Lunch, Dinner
                      list: {
                        type: "array",
                        items: {
                          type: "object",
                          properties: {
                            name: { type: "string" },
                            ingredients: {
                              type: "array",
                              items: { type: "string" },
                            },
                            nutritional: {
                              type: "array",
                              items: { type: "string" },
                            },
                            videoExample: { type: "string", format: "uri" },
                            imgUrl: { type: "string", format: "uri" },
                          },
                          required: [
                            "name",
                            "ingredients",
                            "nutritional",
                            "videoExample",
                            "imgUrl",
                          ],
                        },
                      },
                    },
                    required: ["type", "list"],
                  },
                },
              },
              required: ["recipes"],
            },
          },
        },
      });

      return completion.choices[0].message.content;
    } catch (error) {
      console.error("Error generating recipes:", error);
      throw new Error("OpenAI API error");
    }
  }

  async saveRecipes(userid, recipes) {
    try {
      await pool.query(
        `INSERT INTO user_recipes (iduser, recipes)
         VALUES (?, ?)
         ON DUPLICATE KEY UPDATE
         recipes = VALUES(recipes)`,
        [userid, recipes]
      );
      return;
    } catch (error) {
      console.error("Error saving recipes:", error);
      throw new Error("Database error");
    }
  }
}

export const userProfileStore = new UserProfileStore();
