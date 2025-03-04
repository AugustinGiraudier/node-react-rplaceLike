export interface Pixel {
	color: string; // Couleur en hex
	userId: string | null; // ou null car un pixel peut être libre
	timestamp: Date | null; // idem
}
