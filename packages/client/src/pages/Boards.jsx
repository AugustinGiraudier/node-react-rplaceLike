import { useEffect, useState } from 'react';
import BoardCard from '../components/BoardCard';
import './Boards.css';

const {VITE_API_URL} = import.meta.env;

function Boards() {

	const [boards, setBoards] = useState([]);

	useEffect(() => {
		const fetchData = async () => {
			try {
				const boardsResponse = await fetch(`${VITE_API_URL}/boards`);
				const boardsData = await boardsResponse.json();
				setBoards(boardsData);
			} catch (err) {
				console.error('Error fetching data:', err);
			}
		};

		fetchData();
	}, []);



	return (
		<div id="boards-container">
		<div id="boards-list">

			{
				boards.map((board) => {
					return (
						<BoardCard key="" name={board.name} author={board?.author.username} time={"2j"} id={board._id}/>
					);
				})
			}

		</div>



		</div>
	);
}

export default Boards;
