export function calculateDifficulty(distance: number | null | undefined, elevation: number | null | undefined): number {
    const d = distance || 0;
    const e = elevation || 0;
    
    if (d === 0 && e === 0) return 0;
    
    return Math.floor((d / 25) + (e / 320));
}
