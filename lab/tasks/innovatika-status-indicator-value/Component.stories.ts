import React from "react";
import { storiesOf } from "@storybook/react";
import StatusBox from "./Component";

storiesOf("StatusBox", module)
    .add("All statuses", () => <StatusBox status="all" />)
    .add("Normal", () => <StatusBox status="normal" />)
    .add("Elevated", () => <StatusBox status="elevated" />)
    .add("High", () => <StatusBox status="high" />)
    .add("Unknown", () => <StatusBox status="unknown" />);
