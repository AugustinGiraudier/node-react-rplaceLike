const PixelBoard = require("../models/PixelBoard");
const Chunk = require("../models/Chunk");
//const Pixel = require("../models/Pixel");

// ----------- USER -------------

const getAllBoards = async () => {
	return PixelBoard.find() || null;
};
// TODO : get one board by id
// TODO : poser pixel

// ----------- ADMIN -------------

const createBoard = async (data) => {

	/* exemple data :
	{
	  name: "BoardTest"
	  author: "67d0461b97155cfb09ed84a4",
	  width: 512,
	  height: 512,
	  placementDelay: 3000
	}
	 */


	console.log(data);
	//Validate the data is present
	if (!data.name || data.name === "") throw new Error("Name is required");
	if (!data.author) throw new Error("Author is required");
	if (!data.width || !(data.width % 16 === 0)) throw new Error("Width is required");
	if (!data.height || !(data.height % 16 === 0)) throw new Error("Height is required");
	if (!data.placementDelay || data.placementDelay < 0) throw new Error("Placement delay is required");

	// fill chunks using data.width and height
	data.chunkSize = 16;
	data.chunks = [];

	// Calcul du nombre de chunks en largeur et hauteur
	const chunksX = data.width / data.chunkSize;
	const chunksY = data.height / data.chunkSize;

	for (let i = 0; i < chunksX; i++) {
		for (let j = 0; j < chunksY; j++) {

			// Créer une matrice 2D de pixels pour le chunk
			const pixels = Array.from({ length: data.chunkSize }, () =>
				Array.from({ length: data.chunkSize }, () => ({
					color: '#FFFFFF',
					userId: null,
					timestamp: null
				}))
			);

			// Créer le chunk avec les pixels correctement initialisés
			const chunk = await Chunk.create({
				x: i * data.chunkSize,
				y: j * data.chunkSize,
				pixels: pixels
			});

			data.chunks.push(chunk._id);
		}
	}

	return PixelBoard.create(data);
};
// TODO : update board
// TODO : delete board

module.exports = { getAllBoards, createBoard };
