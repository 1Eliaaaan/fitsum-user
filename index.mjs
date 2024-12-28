import { res } from "./responses.mjs";
import { userProfileStore } from "./model.mjs";
import { authenticateToken } from "./middleware.mjs";

export const handler = async (event) => {
  try {
    console.log("EVENT", event);

    const route = event.routeKey;
    const decodedUserId = await authenticateToken(event);

    if (!decodedUserId?.userId) return res("User not authenticated", 401);

    const userId = Number(event.pathParameters?.id);
    if (!userId || userId !== decodedUserId.userId) {
      return res("User ID mismatch", 401);
    }

    switch (route) {
      case "POST /user/userProfile/{id}":
        try {
          const body = JSON.parse(event.body || "{}");
          const {
            username,
            age,
            weight,
            height,
            objective,
            training_days,
            profiling_form,
          } = body;

          if (
            !username ||
            !age ||
            !weight ||
            !height ||
            !objective ||
            !training_days ||
            !profiling_form
          ) {
            return res("Missing required fields", 400);
          }

          // Actualiza el perfil del usuario
          await userProfileStore.updateUserProfile(
            userId,
            username,
            age,
            weight,
            height,
            objective,
            training_days,
            profiling_form
          );

          return res("User data created successfully", 200);
        } catch (error) {
          console.error("Error:", error);
          return res("Internal Server Error", 500);
        }

      case "POST /user/userRoutines/{id}":
        try {
          const body = JSON.parse(event.body || "{}");
          const {
            username,
            age,
            weight,
            height,
            objective,
            training_days,
            profiling_form,
          } = body;

          if (
            !username ||
            !age ||
            !weight ||
            !height ||
            !objective ||
            !training_days ||
            !profiling_form
          ) {
            return res("Missing required fields", 400);
          }

          const routines = await userProfileStore.createRoutine(
            age,
            weight,
            height,
            objective,
            training_days
          );

          await userProfileStore.saveRoutine(userId, routines);

          return res("User data created successfully", 200);
        } catch (error) {
          console.error("Error:", error);
          return res("Internal Server Error", 500);
        }
      case "POST /user/userRecipes/{id}":
        try {
          const body = JSON.parse(event.body || "{}");
          const {
            username,
            age,
            weight,
            height,
            objective,
            training_days,
            profiling_form,
          } = body;

          if (
            !username ||
            !age ||
            !weight ||
            !height ||
            !objective ||
            !training_days ||
            !profiling_form
          ) {
            return res("Missing required fields", 400);
          }

          const recipes = userProfileStore.createRecipes(
            age,
            weight,
            height,
            objective
          );

          userProfileStore.saveRecipes(userId, recipes);

          return res("User data created successfully", 200);
        } catch (error) {
          console.error("Error:", error);
          return res("Internal Server Error", 500);
        }
      case "GET /user/userProfile/{id}":
        try {
          const user = await userProfileStore.findByIdUser(parseInt(userId));
          if (!user) {
            return res.status(404).json({ message: "User not found" });
          }

          const userProfile = await userProfileStore.findByIdUser(
            Number(userId)
          );
          if (!userProfile) {
            return res("User not found", 400);
          }

          return res(userProfile, 200);
        } catch (error) {
          console.error("Error:", error);
          return res("Internal Server Error", 500);
        }
      case "GET /user/userRoutines/{id}":
        try {
          const userRoutines = await userProfileStore.findUserRoutinesById(
            userId
          );
          if (!userRoutines) {
            return res("User routines not found", 400);
          }

          return res(userRoutines, 200);
        } catch (error) {
          console.error("Error:", error);
          return res("Internal Server Error", 500);
        }
      case "GET /user/userRecipes/{id}":
        try {
          const userRecipes = await userProfileStore.findUserRecipesById(
            userId
          );
          if (!userRecipes) {
            return res("User not recipes found", 400);
          }

          return res(userRecipes, 200);
        } catch (error) {
          console.error("Error:", error);
          return res("Internal Server Error", 500);
        }
      default:
        return res("Route not found", 404);
    }
  } catch (error) {
    console.log(error);
    return res("Internal Server Error", 500);
  }
};
