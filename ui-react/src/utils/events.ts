/**
 * stopPropagation
 * 
 * A small utility function to stop event propagation.
 * Can be used with React SyntheticEvent or native DOM events.
 * 
 * Usage:
 * 
 * import { stopPropagation } from '@/utils/events';
 * 
 * <Checkbox onClick={stopPropagation} />
 * 
 * This helps prevent parent elements from receiving the event.
 */

export const stopPropagation = (e: React.SyntheticEvent | Event): void => {
  // Prevent the event from bubbling up to parent elements
  e.stopPropagation();
};
