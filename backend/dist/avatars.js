"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateAvatar = generateAvatar;
function generateAvatar(name) {
    const [first, last] = name.split(' ');
    const initials = `${first[0]}${last ? last[0] : ''}`.toUpperCase();
    return { name, initials };
}
