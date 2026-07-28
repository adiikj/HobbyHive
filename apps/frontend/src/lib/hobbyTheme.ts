export const HOBBY_COLORS: Record<string, string> = {
  Dance: "#DB2777",
  Fitness: "#FFB703",
  Art: "#FF6F61",
  Anime: "#2C7A7B",
  Gaming: "#8B5CF6",
  Singing: "#F59E0B",
};

export function getHobbyColor(hobby: string): string {
  return HOBBY_COLORS[hobby] ?? "#DB2777";
}
