import React from 'react';

export const CelestialOrrery = () => {
    return (
        <>
            <style>{`
                @keyframes orbit-rotate {
                    from {
                        transform: rotate(0deg);
                    }
                    to {
                        transform: rotate(360deg);
                    }
                }

                @keyframes twinkle {
                    0%, 100% {
                        opacity: 0;
                        transform: scale(0.8);
                    }
                    50% {
                        opacity: 0.3;
                        transform: scale(1);
                    }
                }

                .hero-section {
                    position: relative;
                    width: 100%;
                    height: 100%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .glyph-field {
                    position: absolute;
                    width: 100%;
                    height: 100%;
                    display: flex;
                    align-items: center;
                    justify-content: space-around;
                    padding: 0 5%;
                    z-index: 1;
                }

                .glyph-container {
                    display: flex;
                    gap: 8px;
                    opacity: 0.15;
                }

                .glyph-part {
                    width: 3px;
                    height: 24px;
                    background: currentColor;
                    border-radius: 2px;
                }

                .orrery-field {
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    width: 400px;
                    height: 400px;
                    z-index: 2;
                }

                @media (max-width: 768px) {
                    .orrery-field {
                        width: 280px;
                        height: 280px;
                    }
                }

                .orbit {
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    border: 1px solid rgba(0, 0, 0, 0.1);
                    border-radius: 50%;
                    animation: orbit-rotate linear infinite;
                }

                .dark .orbit {
                    border-color: rgba(255, 255, 255, 0.1);
                }

                .orbit-1 {
                    width: 100px;
                    height: 100px;
                    animation-duration: 20s;
                }

                .orbit-2 {
                    width: 180px;
                    height: 180px;
                    animation-duration: 30s;
                    animation-direction: reverse;
                }

                .orbit-3 {
                    width: 260px;
                    height: 260px;
                    animation-duration: 40s;
                }

                .orbit-4 {
                    width: 340px;
                    height: 340px;
                    animation-duration: 50s;
                    animation-direction: reverse;
                }

                .planet {
                    position: absolute;
                    top: 0;
                    left: 50%;
                    transform: translateX(-50%);
                    width: 8px;
                    height: 8px;
                    background: currentColor;
                    border-radius: 50%;
                    box-shadow: 0 0 8px rgba(0, 0, 0, 0.4);
                    animation: twinkle 3s ease-in-out infinite;
                }

                .dark .planet {
                    box-shadow: 0 0 8px rgba(255, 255, 255, 0.4);
                }

                .orbit-1 .planet {
                    animation-duration: 2s;
                }

                .orbit-2 .planet {
                    animation-duration: 2.5s;
                    animation-delay: 0.3s;
                }

                .orbit-3 .planet {
                    animation-duration: 3s;
                    animation-delay: 0.6s;
                }

                .orbit-4 .planet {
                    animation-duration: 3.5s;
                    animation-delay: 0.9s;
                }
            `}</style>

            <main className="hero-section w-full h-screen flex items-center justify-center text-slate-900 dark:text-white">
                <div className="glyph-field">
                    <div className="glyph-container glyph-1">
                        <div className="glyph-part part-1"></div>
                        <div className="glyph-part part-2"></div>
                        <div className="glyph-part part-3"></div>
                    </div>
                    <div className="glyph-container glyph-2">
                        <div className="glyph-part part-1"></div>
                        <div className="glyph-part part-2"></div>
                    </div>
                    <div className="glyph-container glyph-3">
                        <div className="glyph-part part-1"></div>
                        <div className="glyph-part part-2"></div>
                        <div className="glyph-part part-3"></div>
                    </div>
                </div>

                <div className="orrery-field">
                    <div className="orbit orbit-1">
                        <div className="planet"></div>
                    </div>
                    <div className="orbit orbit-2">
                        <div className="planet"></div>
                    </div>
                    <div className="orbit orbit-3">
                        <div className="planet"></div>
                    </div>
                    <div className="orbit orbit-4">
                        <div className="planet"></div>
                    </div>
                </div>

                {/* The content container is empty */}
                <div className="relative z-10 text-center p-8 max-w-2xl"></div>
            </main>
        </>
    );
};
