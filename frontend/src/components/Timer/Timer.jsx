import { useState, useEffect, useRef } from 'react';
import './Timer.scss';

const Timer = ({ seconds, onTimeout }) => {
    const [timeLeft, setTimeLeft] = useState(seconds);
    const intervalRef = useRef(null);

    useEffect(() => {
        setTimeLeft(seconds);
    }, [seconds]);

    useEffect(() => {
        if (timeLeft <= 0) {
            if (onTimeout) onTimeout();
            return;
        }

        intervalRef.current = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    clearInterval(intervalRef.current);
                    if (onTimeout) onTimeout();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(intervalRef.current);
    }, [timeLeft <= 0]); // Only re-run when it hits 0

    const minutes = Math.floor(timeLeft / 60);
    const secs = timeLeft % 60;
    const isUrgent = timeLeft <= 30;
    const percentage = (timeLeft / seconds) * 100;

    return (
        <div className={`timer ${isUrgent ? 'timer--urgent' : ''}`}>
            <div className="timer__bar">
                <div
                    className="timer__fill"
                    style={{ width: `${percentage}%` }}
                />
            </div>
            <span className="timer__text">
                ⏱ {String(minutes).padStart(2, '0')}:{String(secs).padStart(2, '0')}
            </span>
        </div>
    );
};

export default Timer;
