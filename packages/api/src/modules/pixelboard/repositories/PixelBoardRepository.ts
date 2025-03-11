import {PixelBoard} from "../entities/PixelBoard";

import PixelBoardModel from '../models/pixelBoardSchema';
import {PixelBoardMapper} from "../mapper/PixelBoardMapper";

export interface IPixelBoardRepository {
	create(board: Omit<PixelBoard, 'id' | 'chunks'>): Promise<PixelBoard>;
	findById(id: string): Promise<PixelBoard | null>;
	findAll(filter?: any, options?: any): Promise<PixelBoard[]>;
	update(id: string, data: Partial<PixelBoard>): Promise<PixelBoard | null>;
	addChunkToBoard(boardId: string, chunkId: string): Promise<boolean>;
	countBoards(filter?: any): Promise<number>;
}

export class PixelBoardRepository implements IPixelBoardRepository {
	async create(board: Omit<PixelBoard, 'id' | 'chunks'>): Promise<PixelBoard> {
		const newBoard = new PixelBoardModel({
			...board,
			chunks: []
		});
		await newBoard.save();
		return PixelBoardMapper.mapToEntity(newBoard)
	}

	async findById(id: string): Promise<PixelBoard | null> {
		const board = await PixelBoardModel.findById(id);
		return board ? PixelBoardMapper.mapToEntity(board) : null;
	}

	async findAll(filter: any = {}, options: any = {}): Promise<PixelBoard[]> {
		const { sort = { creationDate: -1 }, limit = 20, skip = 0 } = options;
		const boards = await PixelBoardModel.find(filter)
			.sort(sort)
			.limit(limit)
			.skip(skip);
		return boards.map(PixelBoardMapper.mapToEntity);
	}

	async update(id: string, data: Partial<PixelBoard>): Promise<PixelBoard | null> {
		const board = await PixelBoardModel.findByIdAndUpdate(id, data, { new: true });
		return board ? PixelBoardMapper.mapToEntity(board) : null;
	}

	async addChunkToBoard(boardId: string, chunkId: string): Promise<boolean> {
		const result = await PixelBoardModel.updateOne(
			{ _id: boardId },
			{ $addToSet: { chunks: chunkId } }
		);
		return result.modifiedCount > 0;
	}

	async countBoards(filter: any = {}): Promise<number> {
		return PixelBoardModel.countDocuments(filter);
	}

}
