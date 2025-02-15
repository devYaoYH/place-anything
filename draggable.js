// target elements with the "draggable" class
interact('.draggable')
  .draggable({
    // enable inertial throwing
    inertia: true,
    // keep the element within the area of it's parent
    modifiers: [
      interact.modifiers.restrictRect({
        restriction: 'parent',
        endOnly: true
      })
    ],
    // enable autoScroll
    autoScroll: true,

    listeners: {
      // call this function on every dragmove event
      move: dragMoveListener,

      // call this function on every dragend event
      end (event) {
        var textEl = event.target.querySelector('p')

        textEl && (textEl.textContent =
          'moved a distance of ' +
          (Math.sqrt(Math.pow(event.pageX - event.x0, 2) +
                     Math.pow(event.pageY - event.y0, 2) | 0))
            .toFixed(2) + 'px')
      }
    }
  })
  .resizable({
    edges: { right: true, bottom: true },
    modifiers: [
      interact.modifiers.restrictRect({
        restriction: 'parent'
      })
    ],
    listeners: {
      move: resizeMoveListener
    }
  });

function dragMoveListener (event) {
  var target = event.target
  // keep the dragged position in the data-x/data-y attributes
  var x = (parseFloat(target.getAttribute('data-x')) || 0) + event.dx
  var y = (parseFloat(target.getAttribute('data-y')) || 0) + event.dy

  // Get current rotation
  var rotation = target.getAttribute('data-rotation') || 0;
  
  // Apply both translation and rotation
  target.style.transform = `translate(${x}px, ${y}px) rotate(${rotation}deg)`;
  
  // update the position attributes
  target.setAttribute('data-x', x)
  target.setAttribute('data-y', y)
}

function resizeMoveListener(event) {
  var target = event.target;
  var x = (parseFloat(target.getAttribute('data-x')) || 0);
  var y = (parseFloat(target.getAttribute('data-y')) || 0);
  var rotation = target.getAttribute('data-rotation') || 0;

  // Update the element's size
  target.style.width = event.rect.width + 'px';
  target.style.height = event.rect.height + 'px';

  // Update the position to maintain the same top-left corner
  target.style.transform = `translate(${x}px, ${y}px) rotate(${rotation}deg)`;
}

// this function is used later in the resizing and gesture demos
window.dragMoveListener = dragMoveListener