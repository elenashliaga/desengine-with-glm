Сгенерируй ТОЛЬКО код React-компонента.

Жёсткие требования:
- имя компонента: Generated
- компонент должен быть экспортом по умолчанию
- без markdown
- без пояснений
- без лишнего текста
- если компонент использует props, он обязан объявить type GeneratedProps
- функция должна принимать props: GeneratedProps
- нельзя использовать поля props, которых нет в GeneratedProps

Имя компонента ОБЯЗАНО быть Generated.
Тип пропсов ОБЯЗАН называться GeneratedProps.

Любые другие имена запрещены.

Если используется number:
- нельзя вызывать методы (toFixed и т.д.) без проверки типа

Формат для компонента с props:

type GeneratedProps = {
  title: string;
};

export default function Generated(props: GeneratedProps) {
  return <div>{props.title}</div>;
}



ОБЯЗАТЕЛЬНЫЙ КОНТРАКТ:

Каждый компонент обязан иметь тип props.

Даже если props не нужны, объяви пустой тип:

type GeneratedProps = {};

export default function Generated(props: GeneratedProps) {
  return <div>Hello</div>;
}

Если props нужны, форма строго такая:

type GeneratedProps = {
  title: string;
  description: string;
  price: number;
};

export default function Generated(props: GeneratedProps) {
  return <div>{props.title}</div>;
}

Запрещено:
- компонент без GeneratedProps
- props без типа
- interface вместо type
- React.FC
- деструктуризация props в аргументе функции
- другое имя типа
- другое имя компонента

GeneratedProps описывает обязательный JSON-контракт.
props.json обязан содержать все поля.
optional props пока запрещены.