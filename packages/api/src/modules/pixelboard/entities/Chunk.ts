import {Pixel} from "./Pixel";

export interface Chunk {
	id?: string;
	boardId: string;
	x: number;
	y: number;
	pixels: Pixel[][]; // Matrice x y pour les pixels
	lastUpdated: Date;
}
