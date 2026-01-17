// src/data/mypage.mock.js
export const mypageData = {
  profile: {
    nickname: "골드",
    group: "4분반",
    members: 10,
  },

  status: ["노력부족형", "방치형"],

  score: {
    point: 15,
    totalRank: 40,
    groupRank: 8,
  },

  stats: {
    distance: 3.4,
    found: 5,
    buildings: 3,
  },
};

export const emptyStatsMock = {
  profile: {
    nickname: "골드",
    group: "4분반",
    members: 10,
  },

  status: ["노력부족형", "방치형"],

  score: {
    point: 0,
    totalRank: 40,
    groupRank: 8,
  },

  stats: {
    distance: 0,
    found: 0,
    buildings: 0,
  },
};
