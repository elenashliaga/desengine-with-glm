import React from 'react';
import { Container, Title, Tag, Number } from './styles';
import { ComponentProps } from './props';

const MyComponent: React.FC<ComponentProps> = ({ title, tag, tagNumber }) => {
  return (
    <Container>
      <Title>{title}</Title>
      <Tag>{tag}</Tag>
      <Number>{tagNumber}</Number>
    </Container>
  );
};

export default MyComponent;

MyComponent.defaultProps = {
  title: '',
  tag: '',
  tagNumber: 0
};