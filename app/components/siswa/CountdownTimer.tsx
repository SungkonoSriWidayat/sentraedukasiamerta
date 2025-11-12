// Di dalam file baru: app/components/siswa/CountdownTimer.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';

interface CountdownTimerProps {
    expiryTimestamp: number;
    onTimerEnd: () => void;
}

const CountdownTimer = ({ expiryTimestamp, onTimerEnd }: CountdownTimerProps) => {
    const calculateTimeLeft = useCallback(() => {
        const difference = expiryTimestamp - new Date().getTime();
        if (difference <= 0) {
            onTimerEnd();
            return { hours: 0, minutes: 0, seconds: 0 };
        }
        return {
            hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
            minutes: Math.floor((difference / 1000 / 60) % 60),
            seconds: Math.floor((difference / 1000) % 60),
        };
    }, [expiryTimestamp, onTimerEnd]);

    const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

    useEffect(() => {
        const timer = setTimeout(() => {
            setTimeLeft(calculateTimeLeft());
        }, 1000);
        return () => clearTimeout(timer);
    });

    return (
        <div className="text-2xl font-bold text-teal-600 text-center">
            <span>{String(timeLeft.hours).padStart(2, '0')}</span>:
            <span>{String(timeLeft.minutes).padStart(2, '0')}</span>:
            <span>{String(timeLeft.seconds).padStart(2, '0')}</span>
        </div>
    );
};

export default CountdownTimer;