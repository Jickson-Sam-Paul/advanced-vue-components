import type { Meta, StoryObj } from "@storybook/vue3";
import { ref } from "vue";
import CodeEditor from "./CodeEditor.vue";

const sampleCode = `function changeTextAndColor() {
  // Getting the paragraph element by its ID
  const paragraph = document.getElementById('demo');

  // Changing the text of the paragraph
  if (paragraph) {
    paragraph.textContent = 'The text has changed!';
    paragraph.style.color = 'blue';
  }
}`;

const samplePythonCode = `# variables
name = "Paul"
age = 25

# function
def greet(person):
    return f"Hello, {person}! Welcome."

print(greet(name))

# loop
numbers = [1, 2, 3, 4, 5]
for n in numbers:
    print(n * 2)

# class
class Dog:
    def __init__(self, name, age):
        self.name = name
        self.age = age

    def bark(self):
        print(f"{self.name} says woof!")

my_dog = Dog("Rocky", 3)
my_dog.bark()
`;

const meta = {
  title: "Advanced Components/CodeEditor",
  component: CodeEditor,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
  },
  argTypes: {
    theme: { control: "select", options: ["light", "dark"] },
    modelValue: { control: "text" },
    placeholder: { control: "text" },
    language: {
      control: "select",
      options: [
        "javascript",
        "typescript",
        "python",
        "json",
        "sql",
        "bash",
        "html",
        "css",
      ],
    },
    showLineNumbers: { control: "boolean" },
    showTitle: { control: "boolean" },
    editable: { control: "boolean" },
    languageSelection: { control: "boolean" },
  },
  args: {
    language: "python",
    showLineNumbers: true,
    showTitle: true,
    editable: true,
    theme: "dark",
  },
  render: (args) => ({
    components: { CodeEditor },
    setup() {
      const code = ref(args.modelValue || "");
      return { args, code };
    },
    template:
      '<div style="padding:20px;"><CodeEditor v-bind="args" v-model="code" /></div>',
  }),
} satisfies Meta<typeof CodeEditor>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    modelValue: "",
    language: "python",
    showLineNumbers: true,
    showTitle: true,
    placeholder: "Start typing here ...",
    languages: ["python"],
  },
};

export const CodeBlock: Story = {
  args: {
    language: "javascript",
    showLineNumbers: false,
    showTitle: false,
    modelValue: sampleCode,
    languageSelection: false,
    languages: ["javascript"],
  },
};

export const titleWithLabel: Story = {
  args: {
    language: "python",
    showLineNumbers: false,
    showTitle: true,
    modelValue: samplePythonCode,
    languageSelection: false,
    languages: ["python"],
  },
};

export const lightTheme: Story = {
  args: {
    language: "javascript",
    theme: "light",
    modelValue: sampleCode,
    languageSelection: false,
    languages: ["javascript"],
  },
};

export const selectLanguage: Story = {
  args: {
    language: "javascript",
    theme: "light",
    modelValue: sampleCode,
    languageSelection: true,
    languages: ["javascript", "python", "json"],
  },
};
