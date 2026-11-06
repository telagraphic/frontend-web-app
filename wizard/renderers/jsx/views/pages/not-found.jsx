import { Layout } from "../layouts/page.jsx";

export default function Page(data) {
  return (
    <Layout {...data}>
      <section class="not-found">
        <h1 class="not-found__title">{data.route.title}</h1>
        <p class="not-found__body">{data.route.description}</p>
        <p>
          <a class="internal-link" href="/">
            Home
          </a>
        </p>
      </section>
    </Layout>
  );
}
