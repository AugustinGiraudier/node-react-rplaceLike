import {Chunk} from "./Chunk";

export interface PixelBoard {
	id?: string;
	title: string;
	author: string;
	creationDate: Date;
	endingDate: Date | null; // Un pixel peut être infini ?
	status: 'creating' | 'active' | 'finished';
	width: number;
	height: number;
	chunkSize: number;
	chunks: string[]; // on stock les ids des chunks
	placementDelay: number;
	mod : boolean; // Autoriser ou non de modifier un pixel déjà posé
}
