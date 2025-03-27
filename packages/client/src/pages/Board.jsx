import { useEffect, useState } from 'react';
import { useParams } from "react-router-dom";
import './Board.css';

const {VITE_API_URL} = import.meta.env;

function Board() {

	const { id } = useParams(); // Récupère l'ID depuis l'URL
	const [board, setBoard] = useState(null);

	useEffect(() => {
		const fetchData = async () => {
			try {
				const boardResponse = await fetch(`${VITE_API_URL}/boards/${id}`);
				const boardData = await boardResponse.json();
				setBoard(boardData);
			} catch (err) {
				console.error('Error fetching data:', err);
			}
		};

		if(id) fetchData();
	}, []);



	return (
		<>
		
			<div>{board ? JSON.stringify(board) : "Chargement..."}</div>
		
		</>
		
	);
}

export default Board;
