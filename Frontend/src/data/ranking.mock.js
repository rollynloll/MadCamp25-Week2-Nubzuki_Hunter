// src/data/ranking.mock.js

// 개인 랭킹
export const individualRanks = [
  { id: 1, rank: 1, name: "김철수", group: "A분반", eye: 127, score: 127 },
  { id: 2, rank: 2, name: "이영희", group: "B분반", eye: 98, score: 98 },
  { id: 3, rank: 3, name: "박민수", group: "C분반", eye: 89, score: 89 },
];

// 내 개인 랭킹
export const myRank = {
  rank: 12,
  name: "나",
  group: "E분반",
  eye: 45,
  score: 45,
};

// 분반 랭킹
export const groupRanks = [
  { id: "A", rank: 1, name: "A분반", eye: 512, score: 512 },
  { id: "B", rank: 2, name: "B분반", eye: 468, score: 468 },
  { id: "C", rank: 3, name: "C분반", eye: 431, score: 431 },
  { id: "D", rank: 4, name: "D분반", eye: 390, score: 390 },
];

// 내 분반 랭킹
export const myGroupRank = {
  rank: 8,
  name: "E분반",
  eye: 120,
  score: 120,
};
