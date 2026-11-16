// Pointer-to-board geometry shared by mouse, pen and touch drag placement.
export function positionForDrag(clientX,clientY,cols,rows,stepX,stepY,gapX,gapY,lift) {
  const width=cols*stepX-gapX, height=rows*stepY-gapY;
  return { left:clientX-width/2, top:clientY-lift-height/2, width, height };
}

export function snapToBoard(left,top,firstX,firstY,stepX,stepY,grid=8) {
  if(!Number.isFinite(left)||!Number.isFinite(top)||stepX<=0||stepY<=0)return -1;
  const col=Math.round((left-firstX)/stepX);
  const row=Math.round((top-firstY)/stepY);
  return row<0||row>=grid||col<0||col>=grid?-1:row*grid+col;
}
