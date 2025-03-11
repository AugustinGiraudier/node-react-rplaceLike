import {PixelBoard} from "../entities/PixelBoard";

export class PixelBoardMapper {
	static mapToEntity(doc: any): PixelBoard {
		return {
			id: doc._id.toString(),
			title: doc.title,
			author: doc.author.toString(),
			creationDate: doc.creationDate,
			endingDate: doc.endingDate,
			status: doc.status,
			width: doc.width,
			height: doc.height,
			chunkSize: doc.chunkSize,
			placementDelay: doc.placementDelay,
			mod: doc.mod,
			chunks: doc.chunks.map((c: any) => c.toString())
		};
	}
}
