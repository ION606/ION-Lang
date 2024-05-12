export const ReservedKeys = ['const', 'let', 'var', 'func', 'ion', 'pinknodders', 'return', 'for', 'in', 'of', 'break', 'print', 'error'];
export const ReservedFunctions = {
    'print': (...inp: any) => console.log(...inp),
    'error': (...inp: any) => console.error(...inp),
}