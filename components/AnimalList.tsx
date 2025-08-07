// Legacy AnimalList component - redirects to new refactored version
import React from 'react';
import { AnimalList as NewAnimalList } from './animal/AnimalList';

const AnimalList: React.FC = () => {
  return <NewAnimalList />;
};

export default AnimalList;
