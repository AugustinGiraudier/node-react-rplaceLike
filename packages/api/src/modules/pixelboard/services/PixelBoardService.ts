import {PixelBoard} from "../entities/PixelBoard";

import { IPixelBoardRepository } from '../repositories/PixelBoardRepository';
import { IChunkRepository } from '../repositories/ChunkRepository';
import {Pixel} from "../entities/Pixel";
import {Chunk} from "../entities/Chunk";

export interface IPixelBoardService {
	createBoard(board: Omit<PixelBoard, 'id' | 'chunks'>): Promise<PixelBoard>;
	getBoard(id: string): Promise<PixelBoard | null>;
	getActiveBoards(options?: any): Promise<PixelBoard[]>;
	initializeChunks(boardId: string): Promise<boolean>;
	placePixel(boardId: string, globalX: number, globalY: number, pixel: Pixel): Promise<boolean>;
	getChunk(boardId: string, chunkX: number, chunkY: number): Promise<Chunk | null>;
	getBoardStats(): Promise<{ totalBoards: number, activeBoards: number }>;
}

export class PixelBoardService implements IPixelBoardService {
	constructor(
		private pixelBoardRepo: IPixelBoardRepository,
		private chunkRepo: IChunkRepository
	) {}

	async createBoard(board: Omit<PixelBoard, 'id' | 'chunks'>): Promise<PixelBoard> {
		const newBoard = await this.pixelBoardRepo.create(board);
		await this.initializeChunks(newBoard.id!);
		return  this.pixelBoardRepo.findById(newBoard.id!) as Promise<PixelBoard>;
	}

	async getBoard(id: string): Promise<PixelBoard | null> {
		return this.pixelBoardRepo.findById(id);
	}

	async getActiveBoards(options?: any): Promise<PixelBoard[]> {
		return this.pixelBoardRepo.findAll({ status: 'active' }, options);
	}

	async initializeChunks(boardId: string): Promise<boolean> {
		const board = await this.pixelBoardRepo.findById(boardId);
		if (!board) return false;

		const { width, height, chunkSize } = board;
		const chunksX = Math.ceil(width / chunkSize);
		const chunksY = Math.ceil(height / chunkSize);

		// Créer une matrice vide pour l'initialisation
		const emptyPixels = Array(chunkSize).fill(null).map(() =>
			Array(chunkSize).fill(null).map(() => ({
				color: '#FFFFFF',
				userId: null,
				timestamp: null
			}))
		);

		// Créer tous les chunks
		for (let y = 0; y < chunksY; y++) {
			for (let x = 0; x < chunksX; x++) {
				const chunk = await this.chunkRepo.create({
					boardId,
					x,
					y,
					pixels: JSON.parse(JSON.stringify(emptyPixels)), // Deep copy
					lastUpdated: new Date()
				});

				await this.pixelBoardRepo.addChunkToBoard(boardId, chunk.id!);
			}
		}

		await this.pixelBoardRepo.update(boardId, { status: 'active' });

		return true;
	}

	async placePixel(boardId: string, globalX: number, globalY: number, pixel: Pixel): Promise<boolean> {
		const board = await this.pixelBoardRepo.findById(boardId);
		if (!board || board.status !== 'active') return false;

		// Vérifier que les coordonnées sont dans les limites du board
		if (globalX < 0 || globalX >= board.width || globalY < 0 || globalY >= board.height) {
			return false;
		}

		// Calculer les coordonnées du chunk et du pixel dans le chunk
		const chunkX = Math.floor(globalX / board.chunkSize);
		const chunkY = Math.floor(globalY / board.chunkSize);
		const pixelX = globalX % board.chunkSize;
		const pixelY = globalY % board.chunkSize;

		// Si le board ne permet pas de modifier un pixel déjà placé, vérifier
		if (!board.mod) {
			const chunk = await this.chunkRepo.findByBoardAndPosition(boardId, chunkX, chunkY);
			if (!chunk) return false;

			// Vérifier si le pixel a déjà été placé
			const existingPixel = chunk.pixels[pixelY][pixelX];
			if (existingPixel && existingPixel.userId !== null) {
				return false;
			}
		}

		// Mettre à jour le pixel
		return this.chunkRepo.updatePixel(boardId, chunkX, chunkY, pixelX, pixelY, pixel);
	}

	async getChunk(boardId: string, chunkX: number, chunkY: number): Promise<Chunk | null> {
		return this.chunkRepo.findByBoardAndPosition(boardId, chunkX, chunkY);
	}

	async getBoardStats(): Promise<{ totalBoards: number, activeBoards: number }> {
		const totalBoards = await this.pixelBoardRepo.countBoards();
		const activeBoards = await this.pixelBoardRepo.countBoards({ status: 'active' });

		return {
			totalBoards,
			activeBoards
		};
	}
}
