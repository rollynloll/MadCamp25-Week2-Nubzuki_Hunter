// src/pages/ranking/Ranking_individual.jsx
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function RankingIndividual() {
  const navigate = useNavigate();

  useEffect(() => {
    navigate("/ranking/group", { replace: true });
  }, [navigate]);

  return null;
}
