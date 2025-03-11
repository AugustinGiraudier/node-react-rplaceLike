
import ChunkModel from '../models/chunkSchema';
import {Chunk} from "../entities/Chunk";
import {Pixel} from "../entities/Pixel";

export interface IChunkRepository {
	create(chunk: Omit<Chunk, 'id'>): Promise<Chunk>;
	findById(id: string): Promise<Chunk | null>;
	findByBoardAndPosition(boardId: string, x: number, y: number): Promise<Chunk | null>;
	findByBoard(boardId: string): Promise<Chunk[]>;
	updatePixel(boardId: string, chunkX: number, chunkY: number, pixelX: number, pixelY: number, pixel: Pixel): Promise<boolean>;
}

export class ChunkRepository implements IChunkRepository {
	async create(chunk: Omit<Chunk, 'id'>): Promise<Chunk> {
		const newChunk = new ChunkModel(chunk);
		await newChunk.save();
		return this.mapToEntity(newChunk);
	}

	async findById(id: string): Promise<Chunk | null> {
		const chunk = await ChunkModel.findById(id);
		return chunk ? this.mapToEntity(chunk) : null;
	}

	async findByBoardAndPosition(boardId: string, x: number, y: number): Promise<Chunk | null> {
		const chunk = await ChunkModel.findOne({ boardId, x, y });
		return chunk ? this.mapToEntity(chunk) : null;
	}

	async findByBoard(boardId: string): Promise<Chunk[]> {
		const chunks = await ChunkModel.find({ boardId });
		return chunks.map(this.mapToEntity);
	}

	async updatePixel(boardId: string, chunkX: number, chunkY: number, pixelX: number, pixelY: number, pixel: Pixel): Promise<boolean> {
		// Utiliser l'opérateur $set avec le chemin complet vers le pixel
		const pixelPath = `pixels.${pixelY}.${pixelX}`;
		const result = await ChunkModel.updateOne(
			{ boardId, x: chunkX, y: chunkY },
			{
				$set: { [pixelPath]: pixel, lastUpdated: new Date() }
			}
		);
		return result.modifiedCount > 0;
	}

	private mapToEntity(doc: any): Chunk {
		return {
			id: doc._id.toString(),
			boardId: doc.boardId.toString(),
			x: doc.x,
			y: doc.y,
			pixels: doc.pixels,
			lastUpdated: doc.lastUpdated
		};
	}
}
