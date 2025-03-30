import PropTypes from 'prop-types';
import "./BoardCard.css";
import { Link } from 'react-router-dom';
import { useMemo } from 'react';

BoardCard.propTypes = {
    name: PropTypes.string.isRequired,
    author: PropTypes.string.isRequired,
    time: PropTypes.string.isRequired,
    id: PropTypes.string.isRequired
};

const getNameWithMaxLength = (str, n) => {
    console.log(str.length);
    if(str.length > n){
        return `${str.slice(0,n-3)}...`;
    }
    return str;
};

function BoardCard({name, author, time, id}) {

    const displayableProps = useMemo(()=> {return {
        name: getNameWithMaxLength(name, 15),
        author: getNameWithMaxLength(author, 15),
        time: time
    };}, []);

    return (
        <Link to={`/pixelBoards/${id}`}>
            <div className="board-card-vignette">
                <div>
                    <h2>{displayableProps.name}</h2>
                    <p>By <strong>{displayableProps.author}</strong></p>
                </div>
                <div className='board-card-timer-container'>
                <svg className='board-card-timer-icon' viewBox="0 0 448 512"><path d="M176 0c-17.7 0-32 14.3-32 32s14.3 32 32 32l16 0 0 34.4C92.3 113.8 16 200 16 304c0 114.9 93.1 208 208 208s208-93.1 208-208c0-41.8-12.3-80.7-33.5-113.2l24.1-24.1c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L355.7 143c-28.1-23-62.2-38.8-99.7-44.6L256 64l16 0c17.7 0 32-14.3 32-32s-14.3-32-32-32L224 0 176 0zm72 192l0 128c0 13.3-10.7 24-24 24s-24-10.7-24-24l0-128c0-13.3 10.7-24 24-24s24 10.7 24 24z"/></svg>
                    <p className="board-card-time-left">{displayableProps.time}</p>
                </div>
            </div>
        </Link>
    
    );
}


export default BoardCard;