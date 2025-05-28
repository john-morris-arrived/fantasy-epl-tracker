export type Squad = {
  id: number;
  name: string;
  goalkeeper: {
    id: number;
    name: string;
    addedDate: string;
  };
  teams: {
    id: number;
    name: string;
    addedDate: string;
  }[];
  players: {
    id: number;
    name: string;
    addedDate: string;
  }[];
};

export type Transfer = {
  id: number;
  date: string;
  squadId: number;
  squadName: string;
  type: 'goalkeeper' | 'team' | 'player';
  playerId: number;
  playerName: string;
  action: 'added' | 'removed';
};

export type SquadPoints = {
  goalkeeper: number;
  teams: Record<number, number>;
  players: Record<number, number>;
  total: number;
};

export type SquadWithPoints = Squad & {
  points: SquadPoints;
}; 