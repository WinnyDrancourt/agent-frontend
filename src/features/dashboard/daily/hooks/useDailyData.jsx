import { useState, useCallback } from "react";
import { getData, postData, putData, deleteData } from "@utils/api/data";

export const useDailyData = () => {
  const [state, setState] = useState({
    summary: null,
    matches: [],
    builds: [],
    loading: false,
    error: null,
    selectedDate: new Date(),
  });

  const fetchDailyData = useCallback(async (date) => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const formattedDate = date.toISOString().split("T")[0];

      // Appels parallèles pour toutes les données nécessaires
      const [summaryResponse, matchesResponse, buildsResponse] =
        await Promise.all([
          getData(`v1/summaries/daily/${formattedDate}`),
          getData(`v1/matches/daily/${formattedDate}`),
          getData("v1/user_builds"),
        ]);

      console.log("Summary Response:", summaryResponse);
      console.log("Matches Response:", matchesResponse);
      console.log("Builds Response:", buildsResponse);

      setState((prev) => ({
        ...prev,
        summary: summaryResponse,
        matches: matchesResponse?.matches || [],
        builds: buildsResponse?.builds || [],
        loading: false,
        selectedDate: date,
      }));
    } catch (error) {
      console.error("Error fetching daily data:", error);
      setState((prev) => ({
        ...prev,
        error: error.message,
        loading: false,
      }));
    }
  }, []);

  const addMatch = useCallback(
    async (matchData) => {
      try {
        setState((prev) => ({ ...prev, loading: true }));
        const response = await postData("v1/matches", matchData);
        console.log("Add match response:", response);

        if (response?.match) {
          // Après avoir ajouté un match, on rafraîchit toutes les données
          await fetchDailyData(state.selectedDate);
          return response.match;
        }
        setState((prev) => ({ ...prev, loading: false }));
        return null;
      } catch (error) {
        console.error("Error adding match:", error);
        setState((prev) => ({
          ...prev,
          error: error.message,
          loading: false,
        }));
        return null;
      }
    },
    [state.selectedDate, fetchDailyData]
  );

  const updateMatch = useCallback(
    async (matchId, matchData) => {
      try {
        setState((prev) => ({ ...prev, loading: true }));
        const response = await putData(`v1/matches/${matchId}`, matchData);
        console.log("Update match response:", response);

        if (response?.match) {
          // Après avoir mis à jour un match, on rafraîchit toutes les données
          await fetchDailyData(state.selectedDate);
          return response.match;
        }
        setState((prev) => ({ ...prev, loading: false }));
        return null;
      } catch (error) {
        console.error("Error updating match:", error);
        setState((prev) => ({
          ...prev,
          error: error.message,
          loading: false,
        }));
        return null;
      }
    },
    [state.selectedDate, fetchDailyData]
  );

  const deleteMatch = useCallback(
    async (matchId) => {
      try {
        setState((prev) => ({ ...prev, loading: true }));
        const response = await deleteData(`v1/matches/${matchId}`);
        console.log("Delete match response:", response);

        if (response) {
          // Après avoir supprimé un match, on rafraîchit toutes les données
          await fetchDailyData(state.selectedDate);
          return true;
        }
        setState((prev) => ({ ...prev, loading: false }));
        return false;
      } catch (error) {
        console.error("Error deleting match:", error);
        setState((prev) => ({
          ...prev,
          error: error.message,
          loading: false,
        }));
        return false;
      }
    },
    [state.selectedDate, fetchDailyData]
  );

  return {
    ...state,
    fetchDailyData,
    addMatch,
    updateMatch,
    deleteMatch,
  };
};
