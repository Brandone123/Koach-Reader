import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import type { RootState, AppDispatch } from '../store';

// Use throughout your app instead of plain `useDispatch` and `useSelector`
// Cast needed for RTK thunk compatibility with react-redux types
export const useAppDispatch = () => useDispatch() as any;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector; 